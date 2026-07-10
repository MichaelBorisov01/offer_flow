<script setup lang="ts">
import type { QuestionStatus } from '@/types/interview.ts'
import { CheckOutlined, ExclamationOutlined, RedoOutlined } from '@ant-design/icons-vue'

interface Props {
  currentStatus?: QuestionStatus
}

interface Emits {
  (e: 'statusChange', status: QuestionStatus): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function handleStatusChange(status: QuestionStatus) {
  emit('statusChange', status)
}
</script>

<template>
  <div class="status-actions">
    <a-button
      class="status-button status-known"
      :class="{ active: props.currentStatus === 'known' }"
      @click="handleStatusChange('known')"
    >
      <CheckOutlined />
      Знаю
    </a-button>
    <a-button
      class="status-button status-repeat"
      :class="{ active: props.currentStatus === 'repeat' }"
      @click="handleStatusChange('repeat')"
    >
      <RedoOutlined />
      Повторить
    </a-button>
    <a-button
      class="status-button status-hard"
      :class="{ active: props.currentStatus === 'hard' }"
      @click="handleStatusChange('hard')"
    >
      <ExclamationOutlined />
      Сложно
    </a-button>
  </div>
</template>

<style scoped>
.status-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 16px;
}

.status-button {
  border: 1px solid var(--ant-color-border);
  background: var(--ant-color-bg-container);
  color: var(--ant-color-text-secondary);
  transition: all 0.3s ease;
  border-radius: 8px;
  padding: 8px 16px;
  height: auto;
  font-weight: 500;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.02);
}

/* Состояние "Знаю" */
.status-known {
  border-color: var(--ant-color-success-border);
  color: var(--ant-color-success);
}

.status-known:hover {
  border-color: var(--ant-color-success);
  background: var(--ant-color-success-bg);
}

.status-known.active {
  background: var(--ant-color-success-bg);
  border-color: var(--ant-color-success);
  color: var(--ant-color-success-text-hover);
  box-shadow: 0 0 0 2px var(--ant-color-success-border);
}

/* Состояние "Повторить" */
.status-repeat {
  border-color: var(--ant-color-warning-border);
  color: var(--ant-color-warning);
}

.status-repeat:hover {
  border-color: var(--ant-color-warning);
  background: var(--ant-color-warning-bg);
}

.status-repeat.active {
  background: var(--ant-color-warning-bg);
  border-color: var(--ant-color-warning);
  color: var(--ant-color-warning-text-hover);
  box-shadow: 0 0 0 2px var(--ant-color-warning-border);
}

/* Состояние "Сложно" */
.status-hard {
  border-color: var(--ant-color-error-border);
  color: var(--ant-color-error);
}

.status-hard:hover {
  border-color: var(--ant-color-error);
  background: var(--ant-color-error-bg);
}

.status-hard.active {
  background: var(--ant-color-error-bg);
  border-color: var(--ant-color-error);
  color: var(--ant-color-error-text-hover);
  box-shadow: 0 0 0 2px var(--ant-color-error-border);
}

/* Эффект нажатия для всех кнопок */
.status-button:active {
  transform: scale(0.96);
}

@media (max-width: 768px) {
  .status-actions {
    flex-direction: column;
    gap: 8px;
  }

  .status-button {
    height: 44px; /* Удобная высота для нажатия пальцем */
    font-size: 15px;
  }
}
</style>
