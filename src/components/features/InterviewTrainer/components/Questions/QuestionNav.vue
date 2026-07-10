<script setup lang="ts">
import type { Question } from '@/types/interview.ts'
import { CheckCircleOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons-vue'
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
    <div class="main-navigation">
      <a-button
        :disabled="isFirstQuestion || isEvaluating"
        size="large"
        class="nav-btn prev-btn"
        @click="emit('previous')"
      >
        <LeftOutlined class="nav-icon" />
        <span class="btn-text full-text">Назад</span>
        <span class="btn-text short-text">Назад</span>
      </a-button>

      <a-button
        v-if="!isLastQuestion"
        type="primary"
        size="large"
        :disabled="isEvaluating"
        class="nav-btn next-btn"
        @click="emit('next')"
      >
        <span class="btn-text full-text">Далее</span>
        <span class="btn-text short-text">Далее</span>
        <RightOutlined class="nav-icon" />
      </a-button>

      <a-button
        v-else
        type="primary"
        size="large"
        :disabled="isEvaluating"
        class="nav-btn finish-btn"
        @click="emit('finish')"
      >
        <span class="btn-text full-text">Завершить собеседование</span>
        <span class="btn-text medium-text">Завершить</span>
        <span class="btn-text short-text">Готово</span>
      </a-button>
    </div>

    <div v-if="questions.length > 1" class="quick-navigation">
      <a-divider class="navigation-divider" />

      <div class="questions-grid">
        <a-button
          v-for="(question, index) in questions"
          :key="index"
          :type="getQuestionButtonType(index)"
          :class="getQuestionButtonClass(index)"
          size="small"
          :disabled="isEvaluating"
          class="question-btn"
          @click="emit('goTo', index)"
        >
          <span class="question-number">{{ index + 1 }}</span>
          <CheckCircleOutlined
            v-if="isQuestionAnswered?.(question.id!)"
            class="answered-icon"
          />
        </a-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.question-navigation {
  width: 100%;
  padding: 16px 0;
  background: var(--ant-color-bg-container);
  border-radius: 12px;
  border: 1px solid var(--ant-color-border-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.main-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
}

.nav-btn {
  min-width: 120px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.prev-btn {
  order: 1;
}

.next-btn,
.finish-btn {
  order: 3;
}

.btn-text.full-text {
  display: inline;
}

.btn-text.medium-text {
  display: none;
}

.btn-text.short-text {
  display: none;
}

.nav-icon {
  font-size: 14px;
}

/* Быстрая навигация */
.quick-navigation {
  margin-top: 16px;
  padding: 0 20px;
}

.navigation-divider {
  margin: 0 0 16px 0;
}

.questions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 8px;
  justify-items: center;
}

.question-btn {
  width: 100%;
  max-width: 60px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  position: relative;
  transition: all 0.3s ease;
  border-radius: 6px;
  font-weight: 500;
}

.question-number {
  font-size: 13px;
  font-weight: 600;
}

.answered-icon {
  font-size: 12px;
  color: var(--ant-color-success);
  flex-shrink: 0;
}

/* --- Стили для кнопок статусов (темная/светлая тема) --- */
.questions-grid :deep(.ant-btn) {
  position: relative;
  transition: all 0.3s ease;
}

/* Знаю (Success) */
.questions-grid :deep(.ant-btn.status-known) {
  background-color: var(--ant-color-success-bg);
  border-color: var(--ant-color-success-border);
  color: var(--ant-color-success);
}
.questions-grid :deep(.ant-btn.status-known:hover:not(:disabled)) {
  background-color: var(--ant-color-success-bg-hover);
  border-color: var(--ant-color-success);
  color: var(--ant-color-success-text-hover);
  transform: translateY(-1px);
}

/* Повторить (Warning) */
.questions-grid :deep(.ant-btn.status-repeat) {
  background-color: var(--ant-color-warning-bg);
  border-color: var(--ant-color-warning-border);
  color: var(--ant-color-warning);
}
.questions-grid :deep(.ant-btn.status-repeat:hover:not(:disabled)) {
  background-color: var(--ant-color-warning-bg-hover);
  border-color: var(--ant-color-warning);
  color: var(--ant-color-warning-text-hover);
  transform: translateY(-1px);
}

/* Сложно (Error) */
.questions-grid :deep(.ant-btn.status-hard) {
  background-color: var(--ant-color-error-bg);
  border-color: var(--ant-color-error-border);
  color: var(--ant-color-error);
}
.questions-grid :deep(.ant-btn.status-hard:hover:not(:disabled)) {
  background-color: var(--ant-color-error-bg-hover);
  border-color: var(--ant-color-error);
  color: var(--ant-color-error-text-hover);
  transform: translateY(-1px);
}

.questions-grid :deep(.ant-btn.current-question) {
  box-shadow: 0 0 0 2px var(--ant-color-primary-bg);
}
.questions-grid :deep(.ant-btn.status-known.current-question) {
  border-color: var(--ant-color-success);
  box-shadow: 0 0 0 2px var(--ant-color-success-bg);
}
.questions-grid :deep(.ant-btn.status-repeat.current-question) {
  border-color: var(--ant-color-warning);
  box-shadow: 0 0 0 2px var(--ant-color-warning-bg);
}
.questions-grid :deep(.ant-btn.status-hard.current-question) {
  border-color: var(--ant-color-error);
  box-shadow: 0 0 0 2px var(--ant-color-error-bg);
}

/* --- АДАПТИВНОСТЬ --- */
/* Планшеты и маленькие ноутбуки */
@media (max-width: 1024px) {
  .main-navigation { padding: 0 16px; gap: 12px; }
  .nav-btn { min-width: 100px; height: 38px; font-size: 13px; }
  .quick-navigation { padding: 0 16px; }
  .questions-grid { grid-template-columns: repeat(auto-fill, minmax(45px, 1fr)); gap: 6px; }
  .question-btn { height: 34px; max-width: 55px; }
  .question-number { font-size: 12px; }
}

/* Мобильные устройства */
@media (max-width: 768px) {
  .question-navigation { padding: 12px 0; border-radius: 6px; }
  .main-navigation { padding: 0 12px; gap: 8px; flex-wrap: wrap; }
  .nav-btn { min-width: auto; height: 36px; flex: 1; font-size: 12px; }
  .prev-btn { order: 1; flex: 1; }
  .next-btn, .finish-btn { order: 2; flex: 1; }
  .btn-text.full-text { display: none; }
  .btn-text.medium-text { display: inline; }
  .btn-text.short-text { display: none; }
  .quick-navigation { padding: 0 12px; margin-top: 12px; }
  .questions-grid { grid-template-columns: repeat(auto-fill, minmax(40px, 1fr)); gap: 6px; }
  .question-btn { height: 32px; max-width: 50px; }
  .question-number { font-size: 11px; }
  .answered-icon { font-size: 11px; }
}

/* Маленькие мобильные устройства */
@media (max-width: 480px) {
  .question-navigation { padding: 10px 0; border-radius: 4px; }
  .main-navigation { padding: 0 10px; gap: 6px; }
  .nav-btn { height: 34px; font-size: 11px; padding: 0 8px; }
  .btn-text.full-text, .btn-text.medium-text { display: none; }
  .btn-text.short-text { display: inline; }
  .quick-navigation { padding: 0 10px; margin-top: 10px; }
  .questions-grid { grid-template-columns: repeat(auto-fill, minmax(36px, 1fr)); gap: 4px; }
  .question-btn { height: 30px; max-width: 45px; min-width: 36px; }
  .question-number { font-size: 10px; }
  .answered-icon { font-size: 10px; }
}

/* Очень маленькие экраны */
@media (max-width: 360px) {
  .main-navigation { padding: 0 8px; }
  .nav-btn { height: 32px; font-size: 10px; padding: 0 6px; }
  .quick-navigation { padding: 0 8px; }
  .questions-grid { grid-template-columns: repeat(auto-fill, minmax(32px, 1fr)); gap: 3px; }
  .question-btn { height: 28px; max-width: 40px; min-width: 32px; }
  .question-number { font-size: 9px; }
}

/* Улучшения для touch-устройств */
@media (hover: none) and (pointer: coarse) {
  .nav-btn, .question-btn { min-height: 44px; }
  .questions-grid :deep(.ant-btn:hover:not(:disabled)) { transform: none; }
  .nav-btn:active, .question-btn:active { transform: scale(0.95); }
}

/* Анимации и интерактивность */
.nav-btn:not(:disabled):hover { transform: translateY(-1px); }
.question-btn:not(:disabled):hover { transform: scale(1.05); }
.nav-btn:active:not(:disabled), .question-btn:active:not(:disabled) { transform: scale(0.95); }

@media (prefers-reduced-motion: reduce) {
  .nav-btn, .question-btn { transition: none; }
  .nav-btn:not(:disabled):hover, .question-btn:not(:disabled):hover { transform: none; }
}

/* Подсветка при фокусе для доступности */
.nav-btn:focus-visible, .question-btn:focus-visible { outline: 2px solid var(--ant-color-primary); outline-offset: 2px; }

/* Состояние загрузки */
.nav-btn:disabled, .question-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.nav-btn:disabled:hover, .question-btn:disabled:hover { transform: none; }
</style>
