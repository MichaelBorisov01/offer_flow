<script setup lang="ts">
import type { Question, QuestionStatus } from '@/types/interview'
import type { AllQuestionStatus } from '@/utils/constants/questionConstants'
import { computed } from 'vue'
import { ALL_STATUS_TYPES } from '@/utils/constants/questionConstants'
import { getStatusColor, getStatusLabel } from '@/utils/helpers/questionHelpers'

interface Props {
  questions: Question[]
}

interface Emits {
  (e: 'statusClick', status: QuestionStatus): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

interface StatusStats {
  known: number
  repeat: number
  hard: number
  unknown: number
  counts: {
    known: number
    repeat: number
    hard: number
    unknown: number
  }
}

const statusStats = computed((): StatusStats => {
  const total = props.questions.length
  if (total === 0) {
    return {
      known: 0,
      repeat: 0,
      hard: 0,
      unknown: 100,
      counts: { known: 0, repeat: 0, hard: 0, unknown: 0 },
    }
  }

  const counts = {
    known: props.questions.filter(q => q.status === 'known').length,
    repeat: props.questions.filter(q => q.status === 'repeat').length,
    hard: props.questions.filter(q => q.status === 'hard').length,
    unknown: props.questions.filter(q => !q.status).length,
  }

  return {
    known: (counts.known / total) * 100,
    repeat: (counts.repeat / total) * 100,
    hard: (counts.hard / total) * 100,
    unknown: (counts.unknown / total) * 100,
    counts,
  }
})

const statusTypes = ALL_STATUS_TYPES

function handleStatusClick(status: AllQuestionStatus) {
  if (status === 'unknown')
    return

  emit('statusClick', status as QuestionStatus)
}

function handleSegmentClick(status: AllQuestionStatus) {
  if (status === 'unknown')
    return

  emit('statusClick', status as QuestionStatus)
}

function formatPercentage(value: number) {
  return value === 0 ? '0%' : `${Math.round(value)}%`
}
</script>

<template>
  <div class="status-progress-bar">
    <div class="progress-header">
      <div class="header-content">
        <h4 class="progress-title">
          Статусы вопросов
        </h4>
        <span class="total-questions">Всего: {{ questions.length }}</span>
      </div>
      <div v-if="questions.length > 0" class="mobile-stats">
        <span class="completion-rate">
          Выполнено: {{ Math.round(statusStats.known + statusStats.repeat) }}%
        </span>
      </div>
    </div>

    <!-- Прогресс-бар -->
    <div class="custom-progress-bar">
      <div class="progress-track" @click="handleSegmentClick('known')">
        <div
          v-for="status in statusTypes"
          :key="status"
          class="progress-segment"
          :class="`segment-${status}`"
          :style="{
            width: `${statusStats[status]}%`,
            backgroundColor: getStatusColor(status),
          }"
          :title="`${getStatusLabel(status)}: ${statusStats.counts[status]} (${formatPercentage(statusStats[status])})`"
          @click.stop="handleSegmentClick(status)"
        >
          <div v-if="statusStats[status] >= 15" class="segment-label">
            {{ formatPercentage(statusStats[status]) }}
          </div>
        </div>
      </div>

      <!-- Мини-легенда для мобильных -->
      <div class="mobile-legend">
        <div
          v-for="status in statusTypes"
          :key="`mobile-${status}`"
          class="mobile-legend-item"
          @click="handleStatusClick(status)"
        >
          <div
            class="legend-color"
            :style="{ backgroundColor: getStatusColor(status) }"
          />
          <span class="legend-text">
            {{ getStatusLabel(status) }} ({{ statusStats.counts[status] }})
          </span>
        </div>
      </div>
    </div>

    <!-- Легенда для десктопов -->
    <div class="progress-legend">
      <div
        v-for="status in statusTypes"
        :key="status"
        class="legend-item"
        :class="{ clickable: status !== 'unknown' }"
        @click="handleStatusClick(status)"
      >
        <div
          class="legend-color"
          :style="{ backgroundColor: getStatusColor(status) }"
        />
        <div class="legend-content">
          <span class="legend-label">{{ getStatusLabel(status) }}</span>
          <span class="legend-count">
            {{ statusStats.counts[status] }} ({{ formatPercentage(statusStats[status]) }})
          </span>
        </div>
      </div>
    </div>

    <!-- Сводка для маленьких экранов -->
    <div class="progress-summary">
      <div class="summary-item">
        <span class="summary-label">Выучено:</span>
        <span class="summary-value known">{{ statusStats.counts.known }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">На повтор:</span>
        <span class="summary-value repeat">{{ statusStats.counts.repeat }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Сложные:</span>
        <span class="summary-value hard">{{ statusStats.counts.hard }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-progress-bar {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  position: relative;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.progress-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  line-height: 1.2;
}

.total-questions {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
}

.mobile-stats {
  flex-shrink: 0;
}

.completion-rate {
  font-size: 11px;
  color: #52c41a;
  font-weight: 600;
  background: rgba(82, 196, 26, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
  white-space: nowrap;
}

/* Прогресс-бар */
.custom-progress-bar {
  margin-bottom: 16px;
}

.progress-track {
  width: 100%;
  height: 24px;
  background-color: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  position: relative;
  cursor: pointer;
  border: 1px solid #e8e8e8;
  margin-bottom: 12px;
}

.progress-segment {
  height: 100%;
  transition: all 0.3s ease;
  cursor: pointer;
  min-width: 2px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-segment:hover {
  opacity: 0.9;
  transform: scaleY(1.05);
  z-index: 2;
}

.segment-label {
  color: white;
  font-size: 10px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  padding: 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Легенда для десктопов */
.progress-legend {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;
}

.legend-item.clickable {
  cursor: pointer;
}

.legend-item.clickable:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #d9d9d9;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.legend-label {
  font-size: 12px;
  font-weight: 500;
  color: #262626;
  line-height: 1.2;
}

.legend-count {
  font-size: 11px;
  color: #8c8c8c;
  font-weight: 400;
}

/* Мини-легенда для мобильных */
.mobile-legend {
  display: none;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin-top: 8px;
}

.mobile-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-legend-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.mobile-legend-item .legend-color {
  width: 10px;
  height: 10px;
}

.mobile-legend-item .legend-text {
  font-size: 10px;
  font-weight: 500;
  color: #262626;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

/* Сводка прогресса */
.progress-summary {
  display: none;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  background: white;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.summary-label {
  font-size: 10px;
  color: #8c8c8c;
  font-weight: 400;
  text-align: center;
}

.summary-value {
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

.summary-value.known {
  color: #52c41a;
}

.summary-value.repeat {
  color: #fa8c16;
}

.summary-value.hard {
  color: #ff4d4f;
}

@media (max-width: 1024px) {
  .progress-legend {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .legend-item {
    padding: 6px 10px;
  }
}

@media (max-width: 768px) {
  .status-progress-bar {
    padding: 12px;
  }

  .progress-header {
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .header-content {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .progress-title {
    font-size: 13px;
  }

  .total-questions {
    font-size: 11px;
  }

  .mobile-stats {
    align-self: flex-end;
  }

  .completion-rate {
    font-size: 10px;
    padding: 3px 6px;
  }

  .progress-track {
    height: 20px;
    border-radius: 10px;
    margin-bottom: 8px;
  }

  .segment-label {
    font-size: 9px;
    padding: 0 2px;
  }

  .progress-legend {
    display: none;
  }

  .mobile-legend {
    display: grid;
  }

  .progress-summary {
    display: grid;
  }
}

@media (max-width: 480px) {
  .status-progress-bar {
    padding: 10px;
  }

  .progress-header {
    margin-bottom: 10px;
  }

  .progress-title {
    font-size: 12px;
  }

  .total-questions {
    font-size: 10px;
  }

  .progress-track {
    height: 18px;
    margin-bottom: 6px;
  }

  .segment-label {
    font-size: 8px;
  }

  .mobile-legend {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .mobile-legend-item {
    padding: 4px 6px;
  }

  .mobile-legend-item .legend-text {
    font-size: 9px;
  }

  .progress-summary {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    padding-top: 10px;
  }

  .summary-item {
    padding: 6px 2px;
  }

  .summary-label {
    font-size: 9px;
  }

  .summary-value {
    font-size: 12px;
  }
}

@media (max-width: 360px) {
  .status-progress-bar {
    padding: 8px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .mobile-stats {
    align-self: flex-start;
    margin-top: 4px;
  }

  .progress-track {
    height: 16px;
  }

  .segment-label {
    display: none;
  }

  .mobile-legend {
    display: none;
  }

  .progress-summary {
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }

  .summary-item {
    padding: 4px 2px;
  }

  .summary-label {
    font-size: 8px;
  }

  .summary-value {
    font-size: 11px;
  }
}

/* Улучшения для touch-устройств */
@media (hover: none) and (pointer: coarse) {
  .progress-segment:hover {
    transform: none;
  }

  .legend-item.clickable:hover,
  .mobile-legend-item:hover {
    transform: none;
    box-shadow: none;
  }

  .progress-segment {
    min-width: 4px;
  }
}
</style>
