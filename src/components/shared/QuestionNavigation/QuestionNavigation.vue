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
</script>

<template>
  <div class="question-navigation">
    <!-- Основная навигация -->
    <div class="navigation-buttons">
      <a-space>
        <a-button
          :disabled="isFirstQuestion"
          size="large"
          @click="emit('previous')"
        >
          ← Предыдущий вопрос
        </a-button>

        <a-button
          v-if="!isLastQuestion"
          type="primary"
          size="large"
          @click="emit('next')"
        >
          Следующий вопрос →
        </a-button>

        <a-button
          v-else
          type="primary"
          size="large"
          @click="emit('finish')"
        >
          Завершить собеседование
        </a-button>
      </a-space>
    </div>

    <!-- Быстрая навигация -->
    <div v-if="questions.length > 1" class="quick-navigation">
      <a-divider />
      <h4>Прогресс вопросов:</h4>
      <a-space wrap>
        <a-button
          v-for="(question, index) in questions"
          :key="index"
          :type="getQuestionButtonType(index)"
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
.question-navigation {
  margin-top: 24px;
}

.navigation-buttons {
  margin-bottom: 16px;
}

.quick-navigation h4 {
  margin-bottom: 12px;
  color: #8c8c8c;
}
</style>
