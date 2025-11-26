<script setup lang="ts">
import type { Question } from '@/types/interview'
import { CheckCircleOutlined } from '@ant-design/icons-vue'
import { computed } from 'vue'

interface Props {
  questions: Question[]
  currentIndex: number
  isEvaluating?: boolean
  isQuestionAnswered?: (questionId: string) => boolean
}

interface Emits {
  (e: 'previous'): void
  (e: 'next'): void
  (e: 'finish'): void
  (e: 'goTo', index: number): void
}

const props = withDefaults(defineProps<Props>(), {
  isEvaluating: false,
})

const emit = defineEmits<Emits>()

const isLastQuestion = computed(() => props.currentIndex === props.questions.length - 1)
const isFirstQuestion = computed(() => props.currentIndex === 0)

function getQuestionButtonType(index: number): string {
  const question = props.questions[index]
  if (!question?.id)
    return 'default'

  const isAnswered = props.isQuestionAnswered?.(question.id) ?? false

  if (isAnswered) {
    return props.currentIndex === index ? 'primary' : 'dashed'
  }

  return props.currentIndex === index ? 'primary' : 'default'
}

function getQuestionButtonClass(index: number): string {
  const question = props.questions[index]
  if (!question)
    return ''

  const classes = []

  if (question.status) {
    classes.push(`status-${question.status}`)
  }

  if (index === props.currentIndex) {
    classes.push('current-question')
  }

  return classes.join(' ')
}
</script>

<template>
  <div class="question-navigation">
    <!-- Основная навигация -->
    <a-space class="space">
      <a-button
        :disabled="isFirstQuestion"
        size="large"
        @click="emit('previous')"
      >
        ← Назад
      </a-button>

      <a-button
        v-if="!isLastQuestion"
        type="primary"
        size="large"
        @click="emit('next')"
      >
        Далее →
      </a-button>

      <a-button
        v-else
        type="primary"
        size="large"
        @click="emit('finish')"
      >
        Завершить
      </a-button>
    </a-space>

    <!-- Быстрая навигация -->
    <div v-if="questions.length > 1" class="quick-navigation">
      <a-divider />
      <a-space wrap>
        <a-button
          v-for="(question, index) in questions"
          :key="index"
          :type="getQuestionButtonType(index)"
          :class="getQuestionButtonClass(index)"
          size="small"
          :disabled="isEvaluating"
          @click="emit('goTo', index)"
        >
          {{ index + 1 }}
          <CheckCircleOutlined v-if="isQuestionAnswered?.(question.id!)" />
        </a-button>
      </a-space>
    </div>
  </div>
</template>

<style scoped>
.space :deep(.ant-btn) {
  min-width: 150px;
}

.quick-navigation h4 {
  margin-bottom: 12px;
  color: #8c8c8c;
}

/* Стили для статусов в быстрой навигации */
.quick-navigation :deep(.ant-btn) {
  position: relative;
  transition: all 0.3s ease;
}

.quick-navigation :deep(.ant-btn.status-known) {
  background-color: #f6ffed;
  border-color: #b7eb8f;
  color: #389e0d;
}

.quick-navigation :deep(.ant-btn.status-known:hover) {
  background-color: #d9f7be;
  border-color: #73d13d;
}

.quick-navigation :deep(.ant-btn.status-repeat) {
  background-color: #fff7e6;
  border-color: #ffd591;
  color: #d46b08;
}

.quick-navigation :deep(.ant-btn.status-repeat:hover) {
  background-color: #ffe7ba;
  border-color: #ffa940;
}

.quick-navigation :deep(.ant-btn.status-hard) {
  background-color: #fff2f0;
  border-color: #ffccc7;
  color: #cf1322;
}

.quick-navigation :deep(.ant-btn.status-hard:hover) {
  background-color: #ffccc7;
  border-color: #ff7875;
}

/* Комбинированные стили для текущего вопроса со статусом */
.quick-navigation :deep(.ant-btn.status-known.current-question) {
  border-color: #52c41a;
  box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
}

.quick-navigation :deep(.ant-btn.status-repeat.current-question) {
  border-color: #fa8c16;
  box-shadow: 0 0 0 2px rgba(250, 140, 22, 0.2);
}

.quick-navigation :deep(.ant-btn.status-hard.current-question) {
  border-color: #ff4d4f;
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
}
</style>
