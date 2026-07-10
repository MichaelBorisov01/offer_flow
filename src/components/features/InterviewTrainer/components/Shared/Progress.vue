<script setup lang="ts">
interface Props {
  progress: number
  currentIndex: number
  total: number
  showScore?: boolean
  score?: number | null
}

withDefaults(defineProps<Props>(), {
  showScore: false,
  score: null,
})
</script>

<template>
  <div class="progress">
    <a-progress
      :percent="progress"
      :show-info="false"
      status="active"
      class="progress-bar"
    />
    <div class="progress-info">
      <span>Вопрос {{ currentIndex + 1 }} из {{ total }}</span>
      <span class="progress-percent">{{ progress }}%</span>
      <span v-if="showScore && score !== null" class="score-info">
        Средний балл: {{ score.toFixed(1) }}/10
      </span>
    </div>
  </div>
</template>

<style scoped>
.progress {
  margin-bottom: 24px;
}

.progress-bar {
  margin-bottom: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  color: var(--ant-color-text-secondary);
  flex-wrap: wrap;
  gap: 8px;
}

.progress-percent {
  font-weight: 500;
  color: var(--ant-color-primary);
}

.score-info {
  font-weight: 600;
  color: var(--ant-color-success);
  background: var(--ant-color-success-bg);
  padding: 2px 8px;
  border-radius: 4px;
}
</style>
