<script setup lang="ts">
import type { QuestionStatus } from '@/types/interview'
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
  border: 2px solid #d9d9d9;
  background: #ffffff;
  color: #595959;
  transition: all 0.3s ease;
  border-radius: 6px;
  padding: 8px 16px;
  height: auto;
  font-weight: 500;
}

.status-known {
  border-color: #b7eb8f;
  color: #389e0d;
}

.status-known:hover {
  border-color: #73d13d;
  background: #f6ffed;
  color: #237804;
}

.status-known.active {
  background: #f6ffed;
  border-color: #52c41a;
  color: #135200;
  box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
  transform: scale(1.05);
}

.status-repeat {
  border-color: #ffd591;
  color: #d46b08;
}

.status-repeat:hover {
  border-color: #ffa940;
  background: #fff7e6;
  color: #ad4e00;
}

.status-repeat.active {
  background: #fff7e6;
  border-color: #fa8c16;
  color: #873800;
  box-shadow: 0 0 0 2px rgba(250, 140, 22, 0.2);
  transform: scale(1.05);
}

.status-hard {
  border-color: #ffccc7;
  color: #cf1322;
}

.status-hard:hover {
  border-color: #ff7875;
  background: #fff2f0;
  color: #a8071a;
}

.status-hard.active {
  background: #fff2f0;
  border-color: #ff4d4f;
  color: #820014;
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
  transform: scale(1.05);
}

.status-button :deep(.anticon) {
  margin-right: 6px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .status-actions {
    flex-direction: column;
    gap: 8px;
  }

  .status-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
